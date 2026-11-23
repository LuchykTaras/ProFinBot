import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Background, Handle, MarkerType, Position, ReactFlow,
  addEdge, useEdgesState, useNodesState,
} from '@xyflow/react';
import {
  ChartNoAxesColumnIncreasing, CircleCheck, FileText, Filter,
  House, MessageSquare, Play, Send, Settings, User,
} from 'lucide-react';
import '@xyflow/react/dist/style.css';
import './styles.css';

const blocks = [
  { id: 'start', label: 'Старт', icon: Play, x: 0, width: 144 },
  { id: 'welcome', label: 'Вітання', icon: MessageSquare, x: 178, width: 142 },
  { id: 'contact', label: 'Збір контакту', icon: Send, x: 354, width: 154 },
  { id: 'lead', label: 'Створити заявку', icon: FileText, x: 542, width: 154 },
  { id: 'confirm', label: 'Підтвердження', icon: CircleCheck, x: 730, width: 194 },
];
const blockById = Object.fromEntries(blocks.map(block => [block.id, block]));
const initialNodes = blocks.map(({ id, x, width }) => ({
  id,
  type: 'step',
  position: { x, y: 0 },
  data: { blockId: id },
  style: { width },
  selected: id === 'contact',
}));
const edgeOptions = {
  type: 'straight',
  markerEnd: { type: MarkerType.Arrow, width: 18, height: 18, color: '#616776' },
  style: { stroke: '#616776', strokeWidth: 2 },
};
const initialEdges = blocks.slice(1).map(({ id }, i) => ({
  id: blocks[i].id + '-' + id,
  source: blocks[i].id,
  target: id,
}));
const navigation = [
  ['Огляд', House], ['Заявки', FileText], ['Воронки', Filter],
  ['Розсилки', Send], ['Аналітика', ChartNoAxesColumnIncreasing], ['Налаштування', Settings],
];

function Step({ data, selected }) {
  const { id, label, icon: Icon } = blockById[data.blockId];
  return (
    <div className={'step' + (selected ? ' step-selected' : '')}>
      {id !== 'start' && <Handle type="target" position={Position.Left} aria-label="Вхід блоку" />}
      <Icon size={24} className={id === 'confirm' ? 'success-icon' : 'step-icon'} aria-hidden="true" />
      <span>{label}</span>
      {id !== 'confirm' && <Handle type="source" position={Position.Right} aria-label="Вихід блоку" />}
    </div>
  );
}

const nodeTypes = { step: Step };

function Inspector({ block, contactField, setContactField }) {
  const Icon = block?.icon;
  return (
    <aside className="inspector" aria-labelledby="inspector-title">
      <h2 id="inspector-title">Налаштування блоку</h2>
      {block ? (
        <>
          <div className="block-summary">
            <span className="block-icon"><Icon size={24} aria-hidden="true" /></span>
            {block.label}
          </div>
          {block.id === 'contact' && (
            <div className="contact-settings">
              <label htmlFor="contact-field">Запит у Telegram</label>
              <div className="select-wrap">
                <User size={21} aria-hidden="true" />
                <select id="contact-field" value={contactField} onChange={event => setContactField(event.target.value)}>
                  <option value="phone">Номер телефону</option>
                  <option value="name">Ім’я</option>
                  <option value="text">Текстова відповідь</option>
                </select>
              </div>
              <p className="status"><CircleCheck size={20} aria-hidden="true" />Запит контакту увімкнено</p>
            </div>
          )}
        </>
      ) : <p className="empty-state">Виберіть блок на полотні.</p>}
    </aside>
  );
}

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [contactField, setContactField] = useState('phone');
  const [testResult, setTestResult] = useState('');
  const selectedBlock = blockById[nodes.find(node => node.selected)?.id];

  function testFunnel() {
    const reachable = new Set(['start']);
    const queue = ['start'];
    for (let i = 0; i < queue.length; i++) {
      for (const edge of edges.filter(edge => edge.source === queue[i])) {
        if (!reachable.has(edge.target)) {
          reachable.add(edge.target);
          queue.push(edge.target);
        }
      }
    }
    setTestResult(reachable.size === blocks.length
      ? 'Усі блоки доступні зі старту.'
      : 'Не всі блоки доступні зі старту. Перевірте переходи.');
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">ProFin</div>
        <nav aria-label="Головне меню">
          {navigation.map(([label, Icon]) => label === 'Воронки' ? (
            <a className="nav-item" href="#constructor" aria-current="page" key={label}>
              <Icon size={24} aria-hidden="true" />{label}
            </a>
          ) : (
            <button className="nav-item" type="button" disabled title="Екран ще не підключено" key={label}>
              <Icon size={24} aria-hidden="true" />{label}
            </button>
          ))}
        </nav>
      </aside>
      <header className="header">
        <h1>Аудит ProFin</h1>
        <div className="header-actions">
          <button className="test-button" type="button" onClick={testFunnel}>Тестувати</button>
          <button className="publish-button" type="button" disabled title="Потрібне підключення API">Опублікувати</button>
        </div>
      </header>
      <main className="workspace" id="constructor">
        <section className="canvas" aria-label="Схема воронки">
          <ReactFlow
            nodes={nodes} edges={edges} nodeTypes={nodeTypes} defaultEdgeOptions={edgeOptions}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={connection => setEdges(current => addEdge(connection, current))}
            onNodeClick={(_, node) => setNodes(current => current.map(item => ({
              ...item, selected: item.id === node.id,
            })))}
            deleteKeyCode={null} multiSelectionKeyCode={null}
            minZoom={0.2} maxZoom={2} fitView fitViewOptions={{ padding: 0.06, maxZoom: 1 }}
          >
            <Background gap={26} size={1.25} color="#aab1bf" />
          </ReactFlow>
          {testResult && (
            <div className="test-result">
              <span role="status">{testResult}</span>
              <button type="button" aria-label="Закрити результат" onClick={() => setTestResult('')}>×</button>
            </div>
          )}
        </section>
        <Inspector block={selectedBlock} contactField={contactField} setContactField={setContactField} />
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
